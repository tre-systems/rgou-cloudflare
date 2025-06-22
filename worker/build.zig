const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });

    const optimize = b.standardOptimizeOption(.{});

    const exe = b.addExecutable(.{
        .name = "ai",
        .root_source_file = b.path("src/ai.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Configure for WebAssembly
    exe.entry = .disabled;
    exe.rdynamic = true;

    b.installArtifact(exe);
}
