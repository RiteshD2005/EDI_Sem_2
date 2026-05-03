package com.seminar.bookingsystem.controller;

import com.seminar.bookingsystem.dto.BookingRequest;
import com.seminar.bookingsystem.model.Booking;
import com.seminar.bookingsystem.service.BookingService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // 🔥 History Endpoint
    @GetMapping("/my-history")
    public List<Booking> getMyHistory(Authentication authentication) {

        String email = authentication.getName();

        return bookingService.getUserBookings(email);


    }

    @GetMapping("/day-overview")
    public List<Map<String, Object>> getDayOverview(@RequestParam String date) {
        return bookingService.getDayOverview(LocalDate.parse(date));
    }

    // 🔥 Create Booking
    @PostMapping("/create")
    public Booking createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        return bookingService.createBooking(email, request);
    }

    @GetMapping("/slots")
    public List<Map<String, Object>> getSlots(
            @RequestParam Long hallId,
            @RequestParam String date) {
        return bookingService.getDaySlots(
                hallId,
                LocalDate.parse(date));
    }

    @GetMapping("/my-stats")
    public Map<String, Object> getMyStats(Authentication authentication) {

        String email = authentication.getName();

        return bookingService.getUserStats(email);
    }

    @GetMapping("/all-events")
    public List<Map<String, Object>> getAllEvents() {
        return bookingService.getAllEvents();
    }
}