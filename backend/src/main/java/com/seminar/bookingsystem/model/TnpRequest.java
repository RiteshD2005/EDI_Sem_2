package com.seminar.bookingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "tnp_requests")
@Data
public class TnpRequest {

    public enum Status {
    PENDING,
    APPROVED,
    REJECTED
}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    private String driveType;

    @Column(name = "round_type")
    private String roundType;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer expectedStudents;

    private String description;

    @Enumerated(EnumType.STRING)
    private Status status;

    private String adminNote;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private LocalDateTime approvedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
