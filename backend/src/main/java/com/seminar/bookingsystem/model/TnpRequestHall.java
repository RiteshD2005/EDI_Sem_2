package com.seminar.bookingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tnp_request_halls")
@Data
public class TnpRequestHall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tnp_request_id")
    private TnpRequest tnpRequest;

    @ManyToOne
    @JoinColumn(name = "hall_id")
    private Hall hall;
}