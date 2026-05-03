package com.seminar.bookingsystem.controller;

import com.seminar.bookingsystem.model.Booking;
import com.seminar.bookingsystem.service.BookingService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final BookingService bookingService;

    public AdminController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // 🔥 Get all bookings
    @GetMapping("/bookings")
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // 🔥 Approve
    @PutMapping("/approve/{id}")
    public Booking approve(
            @PathVariable Long id,
            Authentication authentication) {
        return bookingService.approveBooking(id, authentication.getName());
    }

    // 🔥 Reject
    @PutMapping("/reject/{id}")
    public Booking reject(
            @PathVariable Long id,
            @RequestParam String note,
            Authentication authentication) {
        return bookingService.rejectBooking(id, authentication.getName(), note);
    }

    @GetMapping("/slots")
    public List<Map<String, Object>> getSlots(
            @RequestParam Long hallId,
            @RequestParam String date) {
        return bookingService.getDaySlots(
                hallId,
                LocalDate.parse(date));
    }

    @GetMapping("/month-view")
    public List<Map<String, Object>> getMonthlyView(
            @RequestParam int year,
            @RequestParam int month) {
        return bookingService.getMonthlyView(year, month);
    }
}