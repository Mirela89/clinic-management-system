package com.medicareplus.doctor;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.department.Department;
import com.medicareplus.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

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

    // Relatii inverse
    @OneToMany(mappedBy = "doctor")
    private List<Appointment> appointments;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    private List<DoctorSchedule> schedules;
}
