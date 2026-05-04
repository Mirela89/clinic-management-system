package com.medicareplus.department;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT COUNT(d) > 0 FROM Doctor d WHERE d.department.id = :id")
    boolean hasDoctors(@Param("id") Long id);
}
