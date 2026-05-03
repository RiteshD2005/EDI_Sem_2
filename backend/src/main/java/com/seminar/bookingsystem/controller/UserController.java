package com.seminar.bookingsystem.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.seminar.bookingsystem.model.User;
import com.seminar.bookingsystem.repository.UserRepository;
import com.seminar.bookingsystem.service.UserService;

import java.util.Map; 

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "http://localhost:3000")

public class UserController {
    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // 🔥 GET PROFILE

    @GetMapping("/profile")
    public User getProfile(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // For /profile/edit page: get current user info
    @GetMapping("/me")
    public User getMe(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PutMapping("/update")
    public User updateProfile(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String email = authentication.getName();
        return userService.updateProfile(email, body);
    }
}