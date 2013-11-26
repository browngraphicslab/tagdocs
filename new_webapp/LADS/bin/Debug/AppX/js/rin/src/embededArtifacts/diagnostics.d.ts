module rin.diagnostics {
    function newDiagnosticsModule(moduleName: string): {
        log: (...content: string[]) => void;
        assert: (cond: any, strCond: string) => void;
        throwDuplicateException: (msg: string) => void;
    };
}
