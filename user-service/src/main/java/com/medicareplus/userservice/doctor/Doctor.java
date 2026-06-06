package com.medicareplus.userservice.doctor;

import com.medicareplus.userservice.department.Department;
import com.medicareplus.userservice.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "doctors")
@Getter
@Setter
public class Doctor {

    @Id
    private Long userId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @NotBlank
    @Column(nullable = false)
    private String specialization;

    @Column(name = "license_number", unique = true)
    private String licenseNumber;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
}