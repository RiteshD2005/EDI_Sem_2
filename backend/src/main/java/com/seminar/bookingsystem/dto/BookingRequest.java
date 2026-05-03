package com.seminar.bookingsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {

    @NotNull
    private Long hallId;

    private String clubName;

    private String designation;

    private String eventType;

    private String contactPhone;
    private String coordinatorName;
    private String coordinatorPhone;

    @NotNull
    private LocalDate eventDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    private Integer studentStrength;

    private String eventTitle;

    private String eventDescription;

    private String resourcesNeeded;
}