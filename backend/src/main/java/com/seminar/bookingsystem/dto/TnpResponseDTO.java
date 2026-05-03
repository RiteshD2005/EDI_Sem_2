package com.seminar.bookingsystem.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TnpResponseDTO {

    private Long id;
    private String companyName;
    private String driveType;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer expectedStudents;
    private String description;
    private String roundType;
    private String status;

    private String requestedBy; // user name
    private String email;

    private List<String> halls;
}