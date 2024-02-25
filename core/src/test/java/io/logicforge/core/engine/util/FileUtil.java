package io.logicforge.core.engine.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class FileUtil {

    private static final String PATH_TPL = "generated-source-code/%s.txt";

    public static String loadGeneratedJavaFileSource(final String name) throws IOException {
        final File file = new File(FileUtil.class.getClassLoader().getResource(PATH_TPL.formatted(name)).getFile());
        return Files.readString(file.toPath(), StandardCharsets.UTF_8);
    }

}
