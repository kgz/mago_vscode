<?php


class HelloWorld
{

    public function sayHello(string $name)
    {
        return "Hello, World!";
    }
}

interface HelloWorldInterface
{
    public function sayHello(string $name);
}


class HelloWorld2 extends HelloWorld implements HelloWorldInterface
{

    public function sayHello(int $name)
    {
        return "Hello, World!";
    }
}
