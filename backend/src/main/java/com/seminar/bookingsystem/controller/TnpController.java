package com.seminar.bookingsystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.seminar.bookingsystem.dto.TnpRequestDTO;
import com.seminar.bookingsystem.dto.TnpResponseDTO;
import com.seminar.bookingsystem.model.TnpRequest;
// import com.seminar.bookingsystem.model.TnpRequest;
import com.seminar.bookingsystem.security.JwtUtil;
import com.seminar.bookingsystem.service.TnpService;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/tnp")
@CrossOrigin(origins = "https://edi-sem-2.vercel.app")
public class TnpController {

    private final TnpService tnpService;

    public TnpController(TnpService tnpService) {
        this.tnpService = tnpService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(
            @RequestBody TnpRequestDTO dto,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = JwtUtil.extractEmail(token);

        return ResponseEntity.ok(tnpService.createRequest(email, dto));
    }

    @PostMapping("/check-conflicts")
    public ResponseEntity<?> checkConflicts(@RequestBody TnpRequestDTO dto) {
        return ResponseEntity.ok(tnpService.checkConflicts(dto));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(tnpService.getAllRequests());
    }

    @GetMapping("/pending")
    public List<TnpRequest> getPendingRequests() {
        return tnpService.getPendingRequests();
    }

    @GetMapping("/my-requests")
    public List<TnpResponseDTO> getMyRequests(Authentication authentication) {
        return tnpService.getUserRequests(authentication.getName());
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<?> approve(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = JwtUtil.extractEmail(token);

        return ResponseEntity.ok(tnpService.approveRequest(id, email));
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<?> reject(
            @PathVariable Long id,
            @RequestParam(required = false) String note,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = JwtUtil.extractEmail(token);

        return ResponseEntity.ok(tnpService.rejectRequest(id, email, note));
    }
}