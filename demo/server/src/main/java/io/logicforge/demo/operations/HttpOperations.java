package io.logicforge.demo.operations;

import io.logicforge.core.annotations.elements.Action;
import io.logicforge.core.annotations.elements.Function;
import io.logicforge.demo.model.domain.HttpMethod;
import io.logicforge.demo.model.domain.HttpRequest;
import io.logicforge.demo.model.domain.HttpResponse;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse.BodyHandlers;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Future;

public class HttpOperations {

  private final HttpClient httpClient;

  public HttpOperations(final HttpClient httpClient) {
    this.httpClient = httpClient;
  }

  @Function
  public HttpRequest createHttpRequest(final String url, final HttpMethod method) {
    return HttpRequest.builder().uri(url).method(method).build();
  }

  @Function
  public HttpResponse createHttpResponse(final int status, final String body) {
    return HttpResponse.builder().status(status).body(body).build();
  }

  public Future<HttpResponse> sendHttpRequest(final HttpRequest request) throws URISyntaxException,
      IOException, InterruptedException {

    final java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
        .uri(new URI(request.getUri()))
        .method(request.getMethod().toString(), BodyPublishers.noBody())
        .build();
    final CompletableFuture<java.net.http.HttpResponse<String>> asyncResponse = httpClient
        .sendAsync(httpRequest, BodyHandlers.ofString());

    return asyncResponse.thenApply(response -> HttpResponse.builder()
        .status(response.statusCode())
        .body(response.body())
        .build());
  }

  @Action
  public Future<HttpResponse> sendHttpRequest(final String url, final HttpMethod method)
      throws URISyntaxException, IOException, InterruptedException {
    return sendHttpRequest(createHttpRequest(url, method));
  }

}
