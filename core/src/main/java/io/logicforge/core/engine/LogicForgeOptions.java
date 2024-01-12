package io.logicforge.core.engine;

import java.time.Duration;
import java.util.Map;

public record LogicForgeOptions(Duration defaultActionTimeout,Map<String,Duration>actionTimeoutOverrides,Duration shutdownGracePeriod){

@Override public Duration defaultActionTimeout(){return defaultActionTimeout;}

@Override public Map<String,Duration>actionTimeoutOverrides(){return actionTimeoutOverrides;}

@Override public Duration shutdownGracePeriod(){return shutdownGracePeriod;}}
