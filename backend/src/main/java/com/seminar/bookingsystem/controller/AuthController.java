package com.seminar.bookingsystem.controller;

import org.springframework.web.bind.annotation.*;

import com.seminar.bookingsystem.dto.AuthResponse;
import com.seminar.bookingsystem.dto.LoginRequest;
import com.seminar.bookingsystem.dto.RegisterRequest;
import com.seminar.bookingsystem.model.User;
import com.seminar.bookingsystem.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public User register(@Valid @RequestBody RegisterRequest request){
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
