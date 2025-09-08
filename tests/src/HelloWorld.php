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


class HelloWorld2 extends HelloWorld
{
    public function __construct(private string $name)
    {
        $this->sayHello($name);
    }


    public function sayHello(string $name)
    {
        return "Hello, World!";
    }
}
