<?php


interface ResponseWithStaticReturnContract
{
    public int $status { get; set; }

    public static function withStatus(): static;
}