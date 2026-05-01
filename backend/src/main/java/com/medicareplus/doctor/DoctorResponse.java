package com.medicareplus.doctor;

import com.medicareplus.user.UserInfoResponse;
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
    private UserInfoResponse user;
    private String specialization;
    private String licenseNumber;
    private Long departmentId;
    private String departmentName;
}
