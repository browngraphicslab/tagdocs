//------------------------------------------------------------------------------
// <Copyright From='2004' To='2020' Company='Microsoft Corporation'>
//		Copyright (c) Microsoft Corporation. All Rights Reserved.
//		Information Contained Herein is Proprietary and Confidential.
// </Copyright>
//------------------------------------------------------------------------------

using System;
using System.IO;

namespace Concat
{
    class Program
    {
        const int BufferSize = 1024;

        static void Main(string[] args)
        {
            StreamReader reader;
            char []buffer = new char[BufferSize];

            foreach (string arg in args)
            {
                if (File.Exists(arg))
                {
                    reader = new StreamReader(arg);
                    while (!reader.EndOfStream)
                    {
                        int count = reader.Read(buffer, 0, BufferSize);
                        Console.Write(buffer, 0, count);
                    }
                }
                else
                {
                    Console.Error.WriteLine(arg + " could not be found.");
                }
            }
        }
    }
}
