package com.medicareplus.userservice.doctor;

import com.medicareplus.userservice.doctor.DoctorUserInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DoctorResponse {

    private Long userId;
    private DoctorUserInfo user;
    private String specialization;
    private String licenseNumber;
    private Long departmentId;
    private String departmentName;
}
