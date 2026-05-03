package com.seminar.bookingsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.seminar.bookingsystem.model.Hall;

import java.util.Optional;

@Repository
public interface HallsRepository extends JpaRepository<Hall, Long> {

    Optional<Hall> findByName(String name);
}
