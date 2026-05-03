package com.seminar.bookingsystem.repository;

import com.seminar.bookingsystem.model.TnpRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.seminar.bookingsystem.model.User;

import com.seminar.bookingsystem.model.TnpRequest;

import java.util.List;


@Repository
public interface TnpRequestRepository extends JpaRepository<TnpRequest, Long> {

    List<TnpRequest> findByUser(User user);

    List<TnpRequest> findByStatus(TnpRequest.Status status);
}
