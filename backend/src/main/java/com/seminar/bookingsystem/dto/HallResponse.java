package com.seminar.bookingsystem.dto;

import lombok.Data;
import java.util.List;

@Data
public class HallResponse {

    private Long id;
    private String name;
    private int capacity;
    private String location;
    private String coordinatorEmail;
    private List<String> amenities;
    private List<String> imageUrls;
    private String visibility;
    private String type;
    private boolean isActive;
}