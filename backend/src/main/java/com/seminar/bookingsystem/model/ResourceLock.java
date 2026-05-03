package com.seminar.bookingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_locks")
@Data
public class ResourceLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long hallId;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String lockedBy;

    private Long referenceId;

    // 🔥 ADD THIS CONSTRUCTOR HERE
    public ResourceLock(Long hallId, LocalDateTime startTime, LocalDateTime endTime,
                        String lockedBy, Long referenceId) {
        this.hallId = hallId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.lockedBy = lockedBy;
        this.referenceId = referenceId;
    }

    // Optional (recommended)
    public ResourceLock() {}
}