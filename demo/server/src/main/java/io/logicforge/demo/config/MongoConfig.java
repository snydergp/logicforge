package io.logicforge.demo.config;

import com.mongodb.ConnectionString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.mongo.MongoConnectionDetails;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@Slf4j
public class MongoConfig {

  @Bean
  @Primary
  public MongoConnectionDetails mongoConnectionDetails() {
    return () -> new ConnectionString("mongodb://root:secret@mongo:27017/logicforge");
  }

}
