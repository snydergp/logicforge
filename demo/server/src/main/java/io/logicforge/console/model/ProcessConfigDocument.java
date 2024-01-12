package io.logicforge.console.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class ProcessConfigDocument {

    @Id
    private String id;


}
