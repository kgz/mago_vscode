<?php


class HelloWorld
{

    public function __construct(private mixed $name)
    {
        $this->sayHello($name);
    }

    public function sayHello(string $name)
    {
        return "Hello, World!";
    }
}