package com.seminar.bookingsystem.model;

import jakarta.persistence.*;
import lombok.Data;


import java.time.LocalDateTime;

@Entity
@Table(name = "booking")
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔗 User
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // 🔗 Hall
    @ManyToOne
    @JoinColumn(name = "hall_id")
    private Hall hall;

    // 🔥 Time
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // private LocalDate eventDate;

    // 🔥 TSRANGE (if needed by database)
    // @Column(name = "time_range")
    // private String timeRange;

    // 🔥 Event Details
    private String club_name;
    private String designation;
    private String event_type;
    private String event_title;

    private String contactPhone; // who submitted request
    private String coordinatorName; // required if student
    private String coordinatorPhone;

    private String description;

    private String resources_needed;

    private Integer student_count;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private String admin_note;

    private LocalDateTime approved_at;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    // private LocalDateTime created_at;

    public enum Status {
        APPROVED,
        PENDING,
        REJECTED,
        CANCELLED
    }
}