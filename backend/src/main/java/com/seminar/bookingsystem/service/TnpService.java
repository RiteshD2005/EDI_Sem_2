package com.seminar.bookingsystem.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import org.springframework.stereotype.Service;

import com.seminar.bookingsystem.dto.TnpRequestDTO;
import com.seminar.bookingsystem.dto.TnpResponseDTO;
import com.seminar.bookingsystem.model.Booking;
import com.seminar.bookingsystem.model.Hall;
import com.seminar.bookingsystem.model.TnpRequest;
import com.seminar.bookingsystem.model.TnpRequestHall;
import com.seminar.bookingsystem.repository.BookingRepository;
import com.seminar.bookingsystem.service.BookingService;
import com.seminar.bookingsystem.repository.HallsRepository;
import com.seminar.bookingsystem.repository.TnpRequestHallRepository;
import com.seminar.bookingsystem.repository.TnpRequestRepository;
import com.seminar.bookingsystem.repository.UserRepository;
import com.seminar.bookingsystem.model.ResourceLock;
import com.seminar.bookingsystem.repository.ResourceLockRepository;
import com.seminar.bookingsystem.service.EmailService;

import jakarta.transaction.Transactional;

import com.seminar.bookingsystem.model.User;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TnpService {

    private final TnpRequestRepository tnpRequestRepository;
    private final TnpRequestHallRepository tnpRequestHallRepository;
    private final UserRepository userRepository;
    private final HallsRepository hallsRepository;
    private final BookingRepository bookingRepository;
    private final ResourceLockRepository resourceLockRepository; // 🔥 ADD
    private final BookingService bookingService;
    private final EmailService emailService;

    public TnpService(
            TnpRequestRepository tnpRequestRepository,
            TnpRequestHallRepository tnpRequestHallRepository,
            UserRepository userRepository,
            HallsRepository hallsRepository,
            BookingRepository bookingRepository,
            ResourceLockRepository resourceLockRepository, // 🔥 ADD
            BookingService bookingService,
            EmailService emailService) {
        this.tnpRequestRepository = tnpRequestRepository;
        this.tnpRequestHallRepository = tnpRequestHallRepository;
        this.userRepository = userRepository;
        this.hallsRepository = hallsRepository;
        this.bookingRepository = bookingRepository;
        this.resourceLockRepository = resourceLockRepository; // 🔥 ADD
        this.bookingService = bookingService;
        this.emailService = emailService;
    }

    public List<TnpRequest> getPendingRequests() {
        return tnpRequestRepository.findByStatus(TnpRequest.Status.PENDING);
    }

    public TnpRequest createRequest(String email, TnpRequestDTO dto) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getHallIds() == null || dto.getHallIds().isEmpty()) {
            throw new RuntimeException("Select at least one hall");
        }

        TnpRequest request = new TnpRequest();
        request.setCompanyName(dto.getCompanyName());
        request.setDriveType(dto.getDriveType());
        request.setRoundType(dto.getRoundType());
        request.setStartTime(dto.getStartTime());
        request.setEndTime(dto.getEndTime());
        request.setExpectedStudents(dto.getExpectedStudents());
        request.setDescription(dto.getDescription());
        request.setUser(user);

        request.setStatus(TnpRequest.Status.PENDING);

        TnpRequest saved = tnpRequestRepository.save(request);

        for (Long hallId : dto.getHallIds()) {
            Hall hall = hallsRepository.findById(hallId)
                    .orElseThrow(() -> new RuntimeException("Hall not found"));

            TnpRequestHall mapping = new TnpRequestHall();
            mapping.setTnpRequest(saved);
            mapping.setHall(hall);

            tnpRequestHallRepository.save(mapping);
        }

        return saved;
    }

    public Map<String, Object> checkConflicts(TnpRequestDTO dto) {

        if (dto.getHallIds() == null || dto.getHallIds().isEmpty()) {
            throw new RuntimeException("No halls selected");
        }

        if (dto.getStartTime() == null || dto.getEndTime() == null) {
            throw new RuntimeException("Invalid time range");
        }

        List<Long> available = new ArrayList<>();
        List<Long> conflicts = new ArrayList<>();

        for (Long hallId : dto.getHallIds()) {

            List<Booking> overlapping = bookingRepository.findConflictingBookings(
                    hallId,
                    dto.getStartTime(),
                    dto.getEndTime());

            if (overlapping.isEmpty()) {
                available.add(hallId);
            } else {
                conflicts.add(hallId);
            }
        }

        return Map.of(
                "available", available,
                "conflicts", conflicts);
    }

    public List<TnpResponseDTO> getAllRequests() {

        List<TnpRequest> requests = tnpRequestRepository.findAll();

        return requests.stream().map(req -> {

            TnpResponseDTO dto = new TnpResponseDTO();

            dto.setId(req.getId());
            dto.setCompanyName(req.getCompanyName());
            dto.setDriveType(req.getDriveType());
            dto.setStartTime(req.getStartTime());
            dto.setEndTime(req.getEndTime());
            dto.setExpectedStudents(req.getExpectedStudents());
            dto.setDescription(req.getDescription());
            dto.setStatus(req.getStatus().name());

            // 👤 USER (SAFE DATA ONLY)
            dto.setRequestedBy(req.getUser().getFull_name());
            dto.setEmail(req.getUser().getEmail());

            // 🏢 HALLS
            List<TnpRequestHall> halls = tnpRequestHallRepository.findByTnpRequest(req);

            List<String> hallNames = halls.stream()
                    .map(h -> h.getHall().getName())
                    .toList();

            dto.setHalls(hallNames);

            return dto;

        }).toList();
    }

    @Transactional
    public String approveRequest(Long requestId, String adminEmail) {

        TnpRequest request = tnpRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("TNP request not found"));

        if (request.getStatus() != TnpRequest.Status.PENDING) {
            throw new RuntimeException("Only PENDING requests can be approved");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        List<TnpRequestHall> halls = tnpRequestHallRepository.findByTnpRequest(request);

        LocalDate date = request.getStartTime().toLocalDate();

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59);

        for (TnpRequestHall h : halls) {

            Long hallId = h.getHall().getId();

            // 🔥 1. CANCEL STUDENT BOOKINGS
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                    hallId,
                    request.getStartTime(),
                    request.getEndTime());

            bookingService.cancelConflictingBookings(
                    hallId,
                    startOfDay,
                    endOfDay);

            // 🔥 2. CREATE LOCK

            ResourceLock lock = new ResourceLock(
                    hallId,
                    startOfDay,
                    endOfDay,
                    "TNP",
                    request.getId());
            Hall hall = h.getHall();

            if (hall.getCoordinatorEmail() != null && !hall.getCoordinatorEmail().isBlank()) {

                emailService.sendEmail(
                        hall.getCoordinatorEmail(),
                        "📢 TNP Hall Allocation",
                        "Dear Coordinator,\n\n" +
                                "Your hall '" + hall.getName() + "' has been allocated for a TNP activity.\n\n" +
                                "Company: " + request.getCompanyName() + "\n" +
                                "Date: " + request.getStartTime().toLocalDate() + "\n" +
                                "Time: " + request.getStartTime().toLocalTime() + " - "
                                + request.getEndTime().toLocalTime() + "\n\n" +
                                "Please ensure readiness.\n\nRegards,\nAdmin");

            } else {
                System.out.println("No coordinator email for hall: " + hall.getName());
            }

            resourceLockRepository.save(lock);
        }

        request.setStatus(TnpRequest.Status.APPROVED);
        request.setApprovedBy(admin);
        request.setApprovedAt(LocalDateTime.now());

        tnpRequestRepository.save(request);

        return "TNP approved + bookings cancelled + locked ✅";
    }

    @Transactional
    public String rejectRequest(Long requestId, String adminEmail, String note) {

        TnpRequest request = tnpRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("TNP request not found"));

        if (request.getStatus() != TnpRequest.Status.PENDING) {
            throw new RuntimeException("Only PENDING requests can be rejected");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(TnpRequest.Status.REJECTED);
        request.setApprovedBy(admin);
        request.setApprovedAt(LocalDateTime.now());

        if (note != null && !note.isBlank()) {
            request.setAdminNote(note); // make sure this field exists in entity
        }

        tnpRequestRepository.save(request);

        return "TNP request rejected ❌";
    }

    public List<TnpResponseDTO> getUserRequests(String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    List<TnpRequest> requests = tnpRequestRepository.findByUser(user);

    return requests.stream().map(req -> {
        TnpResponseDTO dto = new TnpResponseDTO();

        dto.setId(req.getId());
        dto.setCompanyName(req.getCompanyName());
        dto.setDriveType(req.getDriveType());
        dto.setRoundType(req.getRoundType());
        dto.setStartTime(req.getStartTime());
        dto.setEndTime(req.getEndTime());
        dto.setExpectedStudents(req.getExpectedStudents());
        dto.setDescription(req.getDescription());
        dto.setStatus(req.getStatus().name());

        dto.setRequestedBy(req.getUser().getFull_name());
        dto.setEmail(req.getUser().getEmail());

        List<TnpRequestHall> halls = tnpRequestHallRepository.findByTnpRequest(req);

        dto.setHalls(
            halls.stream()
                .map(h -> h.getHall().getName())
                .toList()
        );

        return dto;

    }).toList();
}
}