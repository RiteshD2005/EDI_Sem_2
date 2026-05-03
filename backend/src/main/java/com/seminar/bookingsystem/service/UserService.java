package com.seminar.bookingsystem.service;

import org.springframework.stereotype.Service;

import com.seminar.bookingsystem.exception.ResourceNotFoundException;
import com.seminar.bookingsystem.model.User;
import com.seminar.bookingsystem.repository.UserRepository;

import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public User makeAdmin(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setRole(User.Role.ADMIN);

        User saved = userRepository.save(user);

        // 📧 SEND EMAIL
        emailService.sendEmail(
                user.getEmail(),
                "🎉 You are now an Admin!",
                "Hello " + user.getFull_name() + ",\n\n" +
                        "You have been granted Admin access in the Seminar Booking System.\n\n" +
                        "You can now manage bookings and halls.\n\n" +
                        "Regards,\nSystem");

        return saved;
    }

    public User updateProfile(String email, Map<String, String> body) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 🔥 Update allowed fields
        if (body.get("full_name") != null) {
            user.setFull_name(body.get("full_name"));
        }

        if (body.get("phone") != null) {
            user.setPhone(body.get("phone"));
        }

        return userRepository.save(user);
    }
}