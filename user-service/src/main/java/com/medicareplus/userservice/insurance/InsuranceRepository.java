package com.medicareplus.userservice.insurance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InsuranceRepository extends JpaRepository<Insurance, Long> {
    boolean existsByPolicyNumber(String policyNumber);

    @Query("SELECT COUNT(p) > 0 FROM Patient p WHERE p.insurance.id = :id")
    boolean hasPatients(@Param("id") Long id);
}
