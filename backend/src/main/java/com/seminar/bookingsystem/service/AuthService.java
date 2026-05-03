package com.seminar.bookingsystem.service;

import org.springframework.stereotype.Service;

import com.seminar.bookingsystem.dto.LoginRequest;
import com.seminar.bookingsystem.dto.RegisterRequest;
import com.seminar.bookingsystem.dto.AuthResponse;
import com.seminar.bookingsystem.dto.UserResponse;
import com.seminar.bookingsystem.exception.UnauthorizedException;
import com.seminar.bookingsystem.model.User;
import com.seminar.bookingsystem.repository.UserRepository;
import com.seminar.bookingsystem.security.JwtUtil;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ✅ REGISTER
    public User register(RegisterRequest request) {

        // ✅ CHECK IF EMAIL ALREADY EXISTS
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with this email");
        }

        User user = new User();
        user.setFull_name(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());

        // 🔐 HASH PASSWORD
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // 🔥 SAFE DEFAULT ROLE
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            user.setRole(User.Role.ADMIN);
        } else if ("FACULTY".equalsIgnoreCase(request.getRole())) {
            user.setRole(User.Role.FACULTY);
        } else if ("TNP".equalsIgnoreCase(request.getRole())) {
            user.setRole(User.Role.TNP);
        } else {
            user.setRole(User.Role.STUDENT);
        }

        return userRepository.save(user);
    }

    // ✅ LOGIN → RETURN TOKEN + USER DATA
    public AuthResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // 🔥 GENERATE JWT
        String token = JwtUtil.generateToken(user.getEmail());

        // 🔥 CREATE USER RESPONSE OBJECT
        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getFull_name(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().toString());

        // 🔥 RETURN TOKEN + USER OBJECT
        return new AuthResponse(token, userResponse);
    }
}