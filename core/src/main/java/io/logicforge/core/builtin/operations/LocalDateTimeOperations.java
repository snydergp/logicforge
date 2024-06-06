package io.logicforge.core.builtin.operations;

import io.logicforge.core.annotations.elements.Converter;
import io.logicforge.core.annotations.elements.Function;
import io.logicforge.core.annotations.metadata.Category;
import io.logicforge.core.constant.WellKnownCategories;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Category(WellKnownCategories.LOCAL_DATE_TIME)
public final class LocalDateTimeOperations {

  @Function
  public static LocalDate localDateToday() {
    return LocalDate.now();
  }

  @Function
  public static LocalTime localTimeNow() {
    return LocalTime.now();
  }

  @Function
  public static LocalDateTime localDateTimeNow() {
    return LocalDateTime.now();
  }

  @Function
  public static LocalDate addLocalDateTimePeriod(final LocalDate date, final double time,
      final TimeUnit timeUnit) {
    return date.plus((long) time, timeUnit.toChronoUnit());
  }

  @Function
  public static LocalDate subtractLocalDateTimePeriod(final LocalDate date, final double time,
      final TimeUnit timeUnit) {
    return date.minus((long) time, timeUnit.toChronoUnit());
  }

  @Function
  public static LocalTime addLocalTimeTimePeriod(final LocalTime date, final double time,
      final TimeUnit timeUnit) {
    return date.plus((long) time, timeUnit.toChronoUnit());
  }

  @Function
  public static LocalTime subtractLocalTimeTimePeriod(final LocalTime date, final double time,
      final TimeUnit timeUnit) {
    return date.minus((long) time, timeUnit.toChronoUnit());
  }

  @Function
  public static LocalDateTime addLocalDateTimeTimePeriod(final LocalDateTime date,
      final double time, final TimeUnit timeUnit) {
    return date.plus((long) time, timeUnit.toChronoUnit());
  }

  @Function
  public static LocalDateTime subtractLocalDateTimeTimePeriod(final LocalDateTime date,
      final double time, final TimeUnit timeUnit) {
    return date.minus((long) time, timeUnit.toChronoUnit());
  }

  @Function
  public static double getLocalDateDifference(final LocalDate reference, final LocalDate test,
      final TimeUnit timeUnit) {
    final long dayDifference = test.toEpochDay() - reference.toEpochDay();
    return timeUnit.convert(dayDifference, TimeUnit.DAYS);
  }

  @Function
  public static double getLocalTimeDifference(final LocalTime reference, final LocalTime test,
      final TimeUnit timeUnit) {
    final long nanoDifference = test.toNanoOfDay() - reference.toNanoOfDay();
    return timeUnit.convert(nanoDifference, TimeUnit.NANOSECONDS);
  }

  @Function
  public static double getLocalDateTimeDifference(final LocalDateTime reference,
      final LocalDateTime test, final TimeUnit timeUnit) {
    final long nanoDifference = test.toInstant(ZoneOffset.UTC).getNano() - reference.toInstant(
        ZoneOffset.UTC).getNano();
    return timeUnit.convert(nanoDifference, TimeUnit.NANOSECONDS);
  }

  @Function
  public static LocalDateTime combineLocalDateAndTime(final LocalDate date, final LocalTime time) {
    return LocalDateTime.of(date, time);
  }

  @Function
  public static LocalDate getDateFromLocalDateTime(final LocalDateTime dateTime) {
    return dateTime.toLocalDate();
  }

  @Function
  public static LocalTime getTimeFromLocalDateTime(final LocalDateTime dateTime) {
    return dateTime.toLocalTime();
  }

  @Function
  public static boolean isLocalDateBefore(final LocalDate reference, final LocalDate test) {
    return test.isBefore(reference);
  }

  @Function
  public static boolean isLocalDateAfter(final LocalDate reference, final LocalDate test) {
    return test.isAfter(reference);
  }

  @Function
  public static boolean isLocalTimeBefore(final LocalTime reference, final LocalTime test) {
    return test.isBefore(reference);
  }

  @Function
  public static boolean isLocalTimeAfter(final LocalTime reference, final LocalTime test) {
    return test.isAfter(reference);
  }

  @Function
  public static boolean isLocalDateTimeBefore(final LocalDateTime reference,
      final LocalDateTime test) {
    return test.isBefore(reference);
  }

  @Function
  public static boolean isLocalDateTimeAfter(final LocalDateTime reference,
      final LocalDateTime test) {
    return test.isAfter(reference);
  }

  @Converter
  public static String localDateToString(final LocalDate date) {
    return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
  }

  @Converter
  public static String localTimeToString(final LocalTime date) {
    return date.format(DateTimeFormatter.ISO_LOCAL_TIME);
  }

  @Converter
  public static String localDateTimeToString(final LocalDateTime date) {
    return date.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
  }

}
