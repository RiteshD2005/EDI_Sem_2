package com.seminar.bookingsystem.repository;

import com.seminar.bookingsystem.model.TnpRequest;
import com.seminar.bookingsystem.model.TnpRequestHall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TnpRequestHallRepository extends JpaRepository<TnpRequestHall, Long> {
    List<TnpRequestHall> findByTnpRequest(TnpRequest request);
}