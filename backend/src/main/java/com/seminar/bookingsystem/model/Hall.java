package com.seminar.bookingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "halls")
public class Hall {

    public enum Visibility {
        PUBLIC,
        TNP_ONLY
    }

    public enum Type {
        LAB,
        HALL,
        CLASSROOM,
        CABIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hall_id")
    private Long id;

    private String name;

    private int capacity;

    private String location;

    @Column(name = "amenities")
    private String amenities; // comma-separated

    @Column(name = "image_urls")
    private String imageUrls; // comma-separated

    @Column(name = "is_active")
    private boolean isActive = true;

    private String coordinatorEmail;

    @Enumerated(EnumType.STRING)
    private Visibility visibility; // PUBLIC, TNP_ONLY

    @Enumerated(EnumType.STRING)
@Column(name = "type")
private Type type;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}