import { MemoryWritableStream } from "./form_parser.js"

test('测试MemoryWritableStream', async () => {
    const stream = new MemoryWritableStream()
    const writer = stream.getWriter()
    await writer.write(Buffer.from("12"))
    await writer.write(Buffer.from("3"))
    await writer.close()

    expect(stream.getString()).toBe("123")
    expect(stream.getNumber()).toBe(123)
})