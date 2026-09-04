// swift-tools-version: 6.0
import PackageDescription

let package = Package(
 name: "SwarmAI",
 platforms: [
 .macOS(.v14)
 ],
 products: [
 .executable(name: "SwarmAI", targets: ["SwarmAI"]),
 ],
 targets: [
 .executableTarget(
 name: "SwarmAI",
 dependencies: [],
 path: "Sources/SwarmAI",
 exclude: [
 "App/Info.plist",
 "UI/Environment.swift",
 ],
 resources: [
 .process("Resources"),
 ]
 ),
 ]
)
