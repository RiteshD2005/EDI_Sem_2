package com.seminar.bookingsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.seminar.bookingsystem.model.Booking;
import com.seminar.bookingsystem.model.Hall;
import com.seminar.bookingsystem.model.User;

import io.lettuce.core.dynamic.annotation.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
        List<Booking> findByUserOrderByCreatedAtDesc(User user);

        List<Booking> findByStatus(Booking.Status status);

        List<Booking> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

        List<Booking> findByHallAndStatusAndStartTimeBetween(
                        Hall hall,
                        Booking.Status status,
                        LocalDateTime start,
                        LocalDateTime end);

        // List<Booking>
        // findByHallAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
        // Hall hall,
        // Booking.Status status,
        // LocalDateTime endTime,
        // LocalDateTime startTime);

        @Query("""
                            SELECT b FROM Booking b
                            WHERE b.hall = :hall
                            AND b.status = :status
                            AND b.startTime < :newEnd
                            AND b.endTime > :newStart
                        """)
        List<Booking> findOverlappingBookings(
                        @Param("hall") Hall hall,
                        @Param("status") Booking.Status status,
                        @Param("newStart") LocalDateTime newStart,
                        @Param("newEnd") LocalDateTime newEnd);

        @Query("""
                            SELECT b FROM Booking b
                            WHERE b.hall.id = :hallId
                            AND b.status = 'APPROVED'
                            AND b.startTime < :end
                            AND b.endTime > :start
                        """)
        List<Booking> findConflictingBookings(
                        @Param("hallId") Long hallId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);
}