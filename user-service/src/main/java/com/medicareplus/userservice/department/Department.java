package com.medicareplus.userservice.department;

import com.medicareplus.userservice.common.model.BaseEntity;
import com.medicareplus.userservice.doctor.Doctor;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "departments")
@Getter
@Setter
public class Department extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name;

    @Column
    private String description;

    @Column
    private Integer floor;

    // Un departament are mai multi doctori, dar un doctor apartine unui singur departament
    @OneToMany(mappedBy = "department")
    private List<Doctor> doctors;
}
