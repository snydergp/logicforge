package io.logicforge.demo.config;

import com.mongodb.ConnectionString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoConnectionDetails;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@Slf4j
public class MongoConfig {

  @Bean
  @Primary
  public MongoConnectionDetails mongoConnectionDetails(
      @Value("${logicforge-demo.database-name:logicforge}")
      final String databaseName, @Value("${logicforge-demo.username:root}")
      final String username, @Value("${logicforge-demo.password:secret}")
      final String password) {
    return new MongoConnectionDetails() {
      @Override
      public ConnectionString getConnectionString() {
        return new ConnectionString("mongodb://root:secret@mongo:27017/logicforge");
      }
    };
  }

}
