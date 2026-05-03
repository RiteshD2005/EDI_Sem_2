package com.seminar.bookingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long user_id;
    private String full_name;
    private String email;
    private String phone;
    private String role;
}
