package com.seminar.bookingsystem.dto;

import lombok.Data;
import java.time.LocalDateTime;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

@Data
public class TnpRequestDTO {

    @NotBlank
    private String companyName;

    @NotBlank
    private String driveType;

    @NotBlank
    private String roundType;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer expectedStudents;

    private String description;

    private List<Long> hallIds;
}