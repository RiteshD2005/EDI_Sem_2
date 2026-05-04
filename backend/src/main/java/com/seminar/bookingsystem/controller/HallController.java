package com.seminar.bookingsystem.controller;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import com.seminar.bookingsystem.dto.HallRequest;
import com.seminar.bookingsystem.dto.HallResponse;
import com.seminar.bookingsystem.model.Hall;
import com.seminar.bookingsystem.service.HallService;
import com.seminar.bookingsystem.repository.UserRepository;
import com.seminar.bookingsystem.security.JwtUtil;
import com.seminar.bookingsystem.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/halls")
// @CrossOrigin(origins = "https://edi-sem-2.vercel.app")
@CrossOrigin(origins = "http://localhost:3000")
public class HallController {

    private final HallService hallService;
    private final UserRepository userRepository;

    public HallController(HallService hallService, UserRepository userRepository) {
        this.hallService = hallService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<HallResponse> getAllHalls(@RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        String email = JwtUtil.extractEmail(token); // 🔥 extract manually

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return hallService.getAllHalls(user);
    }

    // @PostMapping
    // public Hall AddHall(@RequestBody HallRequest request) {
    //     return hallService.AddHall(request);
    // }

    @PutMapping("/{id}/toggle")
    public Hall toggleHall(@PathVariable Long id) {
        return hallService.toggleHall(id);
    }

    
}