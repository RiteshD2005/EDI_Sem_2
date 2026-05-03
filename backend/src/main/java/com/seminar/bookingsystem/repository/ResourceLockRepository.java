package com.seminar.bookingsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.seminar.bookingsystem.model.ResourceLock;

import io.lettuce.core.dynamic.annotation.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceLockRepository extends JpaRepository<ResourceLock, Long> {

    @Query("""
        SELECT r FROM ResourceLock r
        WHERE r.hallId = :hallId
        AND r.startTime < :end
        AND r.endTime > :start
    """)
    List<ResourceLock> findConflicts(
            Long hallId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
    SELECT r FROM ResourceLock r
    WHERE r.startTime < :end
    AND r.endTime > :start
""")
List<ResourceLock> findAllConflicts(
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end
);

}
