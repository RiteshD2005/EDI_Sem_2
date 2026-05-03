package com.seminar.bookingsystem.service;

import com.seminar.bookingsystem.model.Booking;
import com.seminar.bookingsystem.model.User;
import com.seminar.bookingsystem.repository.BookingRepository;
import com.seminar.bookingsystem.repository.HallsRepository;
import com.seminar.bookingsystem.repository.ResourceLockRepository;
import com.seminar.bookingsystem.repository.TnpRequestHallRepository;
import com.seminar.bookingsystem.repository.TnpRequestRepository;
import com.seminar.bookingsystem.repository.UserRepository;
import com.seminar.bookingsystem.exception.*;
import com.seminar.bookingsystem.model.ResourceLock;

import org.springframework.stereotype.Service;

import com.seminar.bookingsystem.dto.BookingRequest;
import com.seminar.bookingsystem.model.Hall;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.HashMap;

@Service
public class BookingService {

        private final BookingRepository bookingRepository;
        private final UserRepository userRepository;
        private final HallsRepository hallsRepository; // ✅ add this
        private final EmailService emailService;
        private final ResourceLockRepository resourceLockRepository;
        private final TnpRequestRepository tnpRequestRepository;
        private final TnpRequestHallRepository tnpRequestHallRepository;

        public BookingService(
                        BookingRepository bookingRepository,
                        UserRepository userRepository,
                        HallsRepository hallsRepository,
                        EmailService emailService,
                        ResourceLockRepository resourceLockRepository,
                        TnpRequestRepository tnpRequestRepository,
                        TnpRequestHallRepository tnpRequestHallRepository) {

                this.bookingRepository = bookingRepository;
                this.userRepository = userRepository;
                this.hallsRepository = hallsRepository;
                this.emailService = emailService;
                this.resourceLockRepository = resourceLockRepository;
                this.tnpRequestRepository = tnpRequestRepository;
                this.tnpRequestHallRepository = tnpRequestHallRepository;
        }

        public List<Booking> getUserBookings(String email) {

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                return bookingRepository.findByUserOrderByCreatedAtDesc(user);
        }

        public List<Booking> getAllBookings() {
                return bookingRepository.findAll();
        }

        @Transactional
        public Booking approveBooking(Long id, String adminEmail) {

                Booking booking = bookingRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != Booking.Status.PENDING) {
                        throw new RuntimeException("Only pending bookings can be approved");
                }

                // 🔥 CHECK COLLISION AGAIN
                List<Booking> overlapping = bookingRepository
                                .findOverlappingBookings(
                                                booking.getHall(),
                                                Booking.Status.APPROVED,
                                                booking.getStartTime(),
                                                booking.getEndTime());

                if (!overlapping.isEmpty()) {
                        throw new ConflictException("Hall already booked for this time slot");
                }

                User admin = userRepository.findByEmail(adminEmail)
                                .orElseThrow(() -> new RuntimeException("Admin not found"));

                booking.setStatus(Booking.Status.APPROVED);
                booking.setApprovedBy(admin);
                booking.setApproved_at(LocalDateTime.now());

                emailService.sendEmail(
                                booking.getUser().getEmail(),
                                "✅ Booking Approved",
                                "Hello,\n\nYour booking for '" + booking.getEvent_title() + "' has been APPROVED.\n\n" +
                                                "Date: " + booking.getStartTime().toLocalDate() + "\n" +
                                                "Time: " + booking.getStartTime().toLocalTime() + " - "
                                                + booking.getEndTime().toLocalTime() + "\n" +
                                                "Hall: " + booking.getHall().getName() + "\n\n" +
                                                "Regards,\nAdmin");

                return bookingRepository.save(booking);
        }

        @Transactional
        public Booking rejectBooking(Long id, String adminEmail, String note) {

                Booking booking = bookingRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != Booking.Status.PENDING) {
                        throw new RuntimeException("Only pending bookings can be rejected");
                }

                User admin = userRepository.findByEmail(adminEmail)
                                .orElseThrow(() -> new RuntimeException("Admin not found"));

                booking.setStatus(Booking.Status.REJECTED);
                booking.setAdmin_note(note);
                booking.setApprovedBy(admin);
                booking.setApproved_at(java.time.LocalDateTime.now());
                emailService.sendEmail(
                                booking.getUser().getEmail(),
                                "❌ Booking Rejected",
                                "Hello,\n\nYour booking for '" + booking.getEvent_title()
                                                + "' has been REJECTED.\n\n Do check on the application. \n\n" +
                                                "Reason: " + (note != null ? note : "Not specified") + "\n\n" +
                                                "Regards,\nAdmin");

                return bookingRepository.save(booking);
        }

        @Transactional
        public Booking createBooking(String email, BookingRequest request) {

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // 🔹 Coordinator validation
                if (user.getRole() == User.Role.STUDENT) {
                        if (request.getCoordinatorName() == null || request.getCoordinatorName().isEmpty()
                                        || request.getCoordinatorPhone() == null
                                        || request.getCoordinatorPhone().isEmpty()) {

                                throw new RuntimeException("Coordinator details required for students");
                        }
                }

                // 🔹 Fetch hall
                Hall hall = hallsRepository.findById(request.getHallId())
                                .orElseThrow(() -> new RuntimeException("Hall not found"));

                // 🔥 STEP 1 — CREATE TIME FIRST
                LocalDateTime startDateTime = LocalDateTime.of(request.getEventDate(), request.getStartTime());
                LocalDateTime endDateTime = LocalDateTime.of(request.getEventDate(), request.getEndTime());

                // 🔥 STEP 2 — CHECK LOCK (FULL DAY OR TIME BASED)
                List<ResourceLock> locks = resourceLockRepository.findConflicts(
                                hall.getId(),
                                startDateTime,
                                endDateTime);

                if (!locks.isEmpty()) {
                        throw new RuntimeException("Hall is locked for this time (TNP booking)");
                }

                // 🔥 STEP 3 — CHECK EXISTING BOOKINGS
                List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                                hall,
                                Booking.Status.APPROVED,
                                startDateTime,
                                endDateTime);

                if (!overlapping.isEmpty()) {
                        throw new RuntimeException("Hall already booked in this time range");
                }

                // 🔥 STEP 4 — CREATE BOOKING
                Booking booking = new Booking();

                booking.setUser(user);
                booking.setHall(hall);
                booking.setStartTime(startDateTime);
                booking.setEndTime(endDateTime);

                booking.setContactPhone(request.getContactPhone());
                booking.setCoordinatorName(request.getCoordinatorName());
                booking.setCoordinatorPhone(request.getCoordinatorPhone());

                booking.setClub_name(request.getClubName());
                booking.setDesignation(request.getDesignation());
                booking.setEvent_type(request.getEventType());
                booking.setEvent_title(request.getEventTitle());

                booking.setDescription(request.getEventDescription());
                booking.setResources_needed(request.getResourcesNeeded());

                booking.setStudent_count(request.getStudentStrength());
                booking.setStatus(Booking.Status.PENDING);

                return bookingRepository.save(booking);
        }

        public List<Map<String, Object>> getDaySlots(Long hallId, LocalDate date) {

                Hall hall = hallsRepository.findById(hallId)
                                .orElseThrow(() -> new RuntimeException("Hall not found"));

                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(23, 59);

                // 🔹 1. BOOKINGS
                List<Booking> bookings = bookingRepository
                                .findByHallAndStatusAndStartTimeBetween(
                                                hall,
                                                Booking.Status.APPROVED,
                                                startOfDay,
                                                endOfDay);

                // 🔹 2. TNP LOCKS
                List<ResourceLock> locks = resourceLockRepository.findConflicts(
                                hallId,
                                startOfDay,
                                endOfDay);

                List<Map<String, Object>> slots = new ArrayList<>();

                LocalTime startDay = LocalTime.of(8, 0);
                LocalTime endDay = LocalTime.of(18, 0);

                LocalTime current = startDay;

                // 🔥 MERGE BOTH EVENTS INTO ONE LIST
                List<Map<String, Object>> events = new ArrayList<>();

                // BOOKINGS → add to events
                for (Booking b : bookings) {
                        events.add(Map.of(
                                        "start", b.getStartTime().toLocalTime(),
                                        "end", b.getEndTime().toLocalTime(),
                                        "type", "BOOKING",
                                        "event", b.getEvent_title()));
                }

                // TNP LOCKS → add to events
                for (ResourceLock l : locks) {
                        events.add(Map.of(
                                        "start", l.getStartTime().toLocalTime(),
                                        "end", l.getEndTime().toLocalTime(),
                                        "type", "TNP",
                                        "event", "TNP BLOCK"));
                }

                // 🔥 SORT ALL EVENTS
                events.sort(Comparator.comparing(e -> (LocalTime) e.get("start")));

                for (Map<String, Object> e : events) {

                        LocalTime eventStart = (LocalTime) e.get("start");
                        LocalTime eventEnd = (LocalTime) e.get("end");

                        // FREE SLOT BEFORE EVENT
                        if (current.isBefore(eventStart)) {
                                slots.add(Map.of(
                                                "start", current.toString(),
                                                "end", eventStart.toString(),
                                                "status", "FREE"));
                        }

                        // EVENT SLOT
                        slots.add(Map.of(
                                        "start", eventStart.toString(),
                                        "end", eventEnd.toString(),
                                        "status", e.get("type"), // 🔥 BOOKING or TNP
                                        "event", e.get("event"),
                                        "hall", hall.getName()));

                        current = eventEnd;
                }

                // REMAINING FREE SLOT
                if (current.isBefore(endDay)) {
                        slots.add(Map.of(
                                        "start", current.toString(),
                                        "end", endDay.toString(),
                                        "status", "FREE"));
                }

                return slots;
        }

        public void cancelConflictingBookings(Long hallId, LocalDateTime start, LocalDateTime end) {

                List<Booking> bookings = bookingRepository.findConflictingBookings(hallId, start, end);

                for (Booking b : bookings) {
                        b.setStatus(Booking.Status.CANCELLED);
                        b.setAdmin_note("Cancelled due to TNP requirement");
                        bookingRepository.save(b);

                        emailService.sendEmail(
                                        b.getUser().getEmail(),
                                        "⚠️ Booking Cancelled",
                                        "Your booking for hall " + b.getHall().getName() +
                                                        " from " + b.getStartTime() + " to " + b.getEndTime() +
                                                        " has been cancelled due to TNP requirements.\n\nPlease rebook another slot.");
                }
        }

        public List<Map<String, Object>> getMonthlyView(int year, int month) {

                LocalDate startDate = LocalDate.of(year, month, 1);
                LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

                LocalDateTime start = startDate.atStartOfDay();
                LocalDateTime end = endDate.atTime(23, 59);

                List<Map<String, Object>> result = new ArrayList<>();

                // ===============================
                // 🔹 1. NORMAL BOOKINGS
                // ===============================
                List<Booking> bookings = bookingRepository.findByStartTimeBetween(start, end)
                                .stream()
                                .filter(b -> b.getStatus() == Booking.Status.APPROVED)
                                .toList();

                for (Booking b : bookings) {

                        Map<String, Object> map = new HashMap<>();

                        String studentName = b.getUser().getFull_name();
                        String coordinatorName = b.getCoordinatorName();

                        String studentPhone = b.getUser() != null ? b.getUser().getPhone() : null;
                        String coordinatorPhone = b.getCoordinatorPhone();

                        String name = studentName;
                        String phone = studentPhone;

                        if (b.getUser().getRole() == User.Role.STUDENT) {
                                if (coordinatorName != null && !coordinatorName.isBlank()) {
                                        name = studentName + " / " + coordinatorName;
                                }
                                if (coordinatorPhone != null && !coordinatorPhone.isBlank()) {
                                        phone = studentPhone + " / " + coordinatorPhone;
                                }
                        }

                        map.put("type", "BOOKING"); // 🔥 IMPORTANT
                        map.put("date", b.getStartTime().toLocalDate().toString());
                        map.put("name", name);
                        map.put("hall", b.getHall() != null ? b.getHall().getName() : "—");
                        map.put("time", b.getStartTime().toLocalTime() + " → " + b.getEndTime().toLocalTime());
                        map.put("phone", phone != null ? phone : "—");
                        map.put("event", b.getEvent_title() != null ? b.getEvent_title() : "—");
                        map.put("eventType", b.getEvent_type() != null ? b.getEvent_type() : "—");

                        result.add(map);
                }

                // ===============================
                // 🔹 2. TNP LOCKS
                // ===============================
                List<ResourceLock> locks = resourceLockRepository.findAllConflicts(start, end);

                for (ResourceLock l : locks) {

                        Map<String, Object> map = new HashMap<>();

                        Hall hall = hallsRepository.findById(l.getHallId()).orElse(null);

                        map.put("type", "TNP"); // 🔥 IMPORTANT
                        map.put("date", l.getStartTime().toLocalDate().toString());
                        map.put("name", "TNP");
                        map.put("hall", hall != null ? hall.getName() : "Unknown");
                        map.put("time", l.getStartTime().toLocalTime() + " → " + l.getEndTime().toLocalTime());
                        map.put("phone", "—");
                        map.put("event", "TNP DRIVE / BLOCK");
                        map.put("eventType", "TNP");

                        result.add(map);
                }

                // ===============================
                // 🔹 3. SORT FINAL DATA
                // ===============================
                result.sort(Comparator.comparing(m -> (String) m.get("date")));

                return result;
        }

        public Map<String, Object> getUserStats(String email) {

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<Booking> bookings = bookingRepository.findByUserOrderByCreatedAtDesc(user);

                long total = bookings.size();

                long accepted = bookings.stream()
                                .filter(b -> b.getStatus() == Booking.Status.APPROVED)
                                .count();

                long pending = bookings.stream()
                                .filter(b -> b.getStatus() == Booking.Status.PENDING)
                                .count();

                long rejected = bookings.stream()
                                .filter(b -> b.getStatus() == Booking.Status.REJECTED)
                                .count();

                long cancelled = bookings.stream()
                                .filter(b -> b.getStatus() == Booking.Status.CANCELLED)
                                .count();

                return Map.of(
                                "totalBookings", total,
                                "accepted", accepted,
                                "pending", pending,
                                "rejected", rejected,
                                "cancelled", cancelled);
        }

        public List<Map<String, Object>> getAllEvents() {

                List<Map<String, Object>> result = new ArrayList<>();

                // 🔹 BOOKINGS
                List<Booking> bookings = bookingRepository.findAll();

                for (Booking b : bookings) {

                        Map<String, Object> map = new HashMap<>();

                        map.put("id", b.getId());
                        map.put("type", "BOOKING");

                        map.put("title", b.getEvent_title());
                        map.put("eventType", b.getEvent_type());

                        map.put("start", b.getStartTime());
                        map.put("end", b.getEndTime());

                        map.put("hall", b.getHall().getName());
                        map.put("status", b.getStatus().name());

                        map.put("user", b.getUser().getFull_name());

                        result.add(map);
                }

                // 🔹 TNP REQUESTS
                var tnpRequests = tnpRequestRepository.findAll();

                for (var t : tnpRequests) {

                        Map<String, Object> map = new HashMap<>();

                        map.put("id", t.getId());
                        map.put("type", "TNP");

                        map.put("title", t.getCompanyName());
                        map.put("eventType", t.getDriveType());

                        map.put("start", t.getStartTime());
                        map.put("end", t.getEndTime());

                        // map.put("status", t.getStatus().name());

                        // 🔥 MULTIPLE HALLS
                        List<String> halls = tnpRequestHallRepository.findByTnpRequest(t)
                                        .stream()
                                        .map(h -> h.getHall().getName())
                                        .toList();

                        map.put("hall", halls);

                        map.put("user", t.getUser().getFull_name());

                        result.add(map);
                }

                return result;
        }

        public List<Map<String, Object>> getDayOverview(LocalDate date) {

                LocalDateTime start = date.atStartOfDay();
                LocalDateTime end = date.atTime(23, 59);

                List<Map<String, Object>> result = new ArrayList<>();

                // BOOKINGS
                List<Booking> bookings = bookingRepository.findByStartTimeBetween(start, end)
                                .stream()
                                .filter(b -> b.getStatus() == Booking.Status.APPROVED)
                                .toList();

                for (Booking b : bookings) {
                        result.add(Map.of(
                                        "type", "BOOKING",
                                        "hall", b.getHall().getName(),
                                        "start", b.getStartTime(),
                                        "end", b.getEndTime(),
                                        "title", b.getEvent_title()));
                }

                // TNP LOCKS
                List<ResourceLock> locks = resourceLockRepository.findAllConflicts(start, end);

                for (ResourceLock l : locks) {
                        Hall hall = hallsRepository.findById(l.getHallId()).orElse(null);

                        result.add(Map.of(
                                        "type", "TNP",
                                        "hall", hall != null ? hall.getName() : "Unknown",
                                        "start", l.getStartTime(),
                                        "end", l.getEndTime(),
                                        "title", "TNP BLOCK"));
                }

                return result;
        }
}