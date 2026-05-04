package com.medicareplus.department;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentResponse {

    private Long id;
    private String name;
    private String description;
    private Integer floor;
    private Integer doctorCount;
}
