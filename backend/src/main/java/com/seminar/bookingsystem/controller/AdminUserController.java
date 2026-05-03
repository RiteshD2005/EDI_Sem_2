package com.seminar.bookingsystem.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.seminar.bookingsystem.model.User;
import com.seminar.bookingsystem.service.UserService;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    // 🔥 ADD ADMIN
    @PostMapping("/add-admin")
    public User addAdmin(@RequestBody Map<String, String> body) {

        String email = body.get("email");

        return userService.makeAdmin(email);
    }
}