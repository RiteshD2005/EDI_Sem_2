package com.seminar.bookingsystem.service;

import org.springframework.stereotype.Service;
import java.util.List;

import com.seminar.bookingsystem.repository.HallsRepository;
import com.seminar.bookingsystem.dto.HallRequest;
import com.seminar.bookingsystem.dto.HallResponse;
import com.seminar.bookingsystem.model.Hall;
import com.seminar.bookingsystem.model.User;

@Service
public class HallService {

    private final HallsRepository hallsRepository;

    public HallService(HallsRepository hallsRepository) {
        this.hallsRepository = hallsRepository;
    }

    public Hall AddHall(HallRequest request) {
        if (hallsRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Hall already exists with this name");
        }

        Hall hall = new Hall();
        hall.setName(request.getName());
        hall.setCapacity(request.getCapacity());
        hall.setLocation(request.getLocation());

        hall.setAmenities(request.getAmenities() != null ? String.join(",", request.getAmenities()) : null);
        hall.setImageUrls(request.getImageUrls() != null ? String.join(",", request.getImageUrls()) : null);

        // 🔥 IMPORTANT ADD THIS
        hall.setVisibility(
                request.getVisibility() != null
                        ? request.getVisibility()
                        : Hall.Visibility.PUBLIC);

        hall.setType(
                request.getType() != null
                        ? Hall.Type.valueOf(request.getType().toUpperCase())
                        : Hall.Type.HALL // default
        );

        return hallsRepository.save(hall);
    }

    public List<Hall> getHallsForUser(User user) {
        if (user.getRole() == User.Role.TNP) {
            return hallsRepository.findAll();
        } else {
            return hallsRepository.findAll()
                    .stream()
                    .filter(h -> h.getVisibility() == null || h.getVisibility() == Hall.Visibility.PUBLIC)
                    .toList();
        }
    }

    // 🔥 FETCH ALL HALLS
    public List<HallResponse> getAllHalls(User user) {

        List<Hall> halls;

        // 🔥 ADMIN → SEE EVERYTHING
        if (user.getRole() == User.Role.ADMIN) {
            halls = hallsRepository.findAll();
        }

        // 🔥 TNP → ONLY ACTIVE (BUT ALL TYPES)
        else if (user.getRole() == User.Role.TNP) {
            halls = hallsRepository.findAll()
                    .stream()
                    .filter(Hall::isActive)
                    .toList();
        }

        // 🔥 STUDENT / FACULTY → PUBLIC + ACTIVE
        else {
            halls = hallsRepository.findAll()
                    .stream()
                    .filter(h -> (h.getVisibility() == null || h.getVisibility() == Hall.Visibility.PUBLIC)
                            && h.isActive())
                    .toList();
        }

        return halls.stream().map(hall -> {
            HallResponse response = new HallResponse();

            response.setId(hall.getId());
            response.setName(hall.getName());
            response.setCapacity(hall.getCapacity());
            response.setLocation(hall.getLocation());

            response.setAmenities(
                    hall.getAmenities() != null && !hall.getAmenities().isEmpty()
                            ? List.of(hall.getAmenities().split(","))
                            : List.of());

            response.setImageUrls(
                    hall.getImageUrls() != null && !hall.getImageUrls().isEmpty()
                            ? List.of(hall.getImageUrls().split(","))
                            : List.of());

            response.setActive(hall.isActive());

            // 🔥 ADD THESE (VERY USEFUL FOR ADMIN UI)
            response.setType(hall.getType() != null ? hall.getType().name() : "HALL");
            response.setVisibility(
                    hall.getVisibility() != null ? hall.getVisibility().name() : "PUBLIC");

            return response;

        }).toList();
    }

    public Hall toggleHall(Long id) {
        Hall hall = hallsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hall not found"));

        hall.setActive(!hall.isActive());

        return hallsRepository.save(hall);
    }

}
