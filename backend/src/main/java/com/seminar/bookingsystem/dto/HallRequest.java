package com.seminar.bookingsystem.dto;

import  lombok.Data;
import java.util.List;

import com.seminar.bookingsystem.model.Hall;

@Data
public class HallRequest {

    private String name;
    private int capacity;
    private String location;
    private String coordinatorEmail;
    private List<String> amenities;
    private List<String> imageUrls;
    private String type;
    private boolean isActive;
    private Hall.Visibility visibility;
}