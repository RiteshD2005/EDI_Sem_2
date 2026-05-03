package com.seminar.bookingsystem.model;

// import static org.mockito.ArgumentMatchers.notNull;

// import org.apache.commons.lang3.ObjectUtils.Null;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "users")
public class User {
    
    public enum Role {
        STUDENT, FACULTY, ADMIN , TNP
    };

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String full_name;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Role role;

    @Column(name = "isactive")
    private boolean isActive = true;

    @Column(name = "created_at",updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "phone")
    private String phone;
}
