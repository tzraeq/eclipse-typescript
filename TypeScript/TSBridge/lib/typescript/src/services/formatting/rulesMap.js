var TypeScript;
(function (TypeScript) {
    (function (Formatting) {
        var RulesMap = (function () {
            function RulesMap() {
                this.map = [];
                this.mapRowLength = 0;
            }
            RulesMap.create = function (rules) {
                var result = new RulesMap();
                result.Initialize(rules);
                return result;
            };

            RulesMap.prototype.Initialize = function (rules) {
                this.mapRowLength = TypeScript.SyntaxKind.LastToken + 1;
                this.map = new Array(this.mapRowLength * this.mapRowLength);

                var rulesBucketConstructionStateList = new Array(this.map.length);

                this.FillRules(rules, rulesBucketConstructionStateList);
                return this.map;
            };

            RulesMap.prototype.FillRules = function (rules, rulesBucketConstructionStateList) {
                var _this = this;
                rules.forEach(function (rule) {
                    _this.FillRule(rule, rulesBucketConstructionStateList);
                });
            };

            RulesMap.prototype.GetRuleBucketIndex = function (row, column) {
                var rulesBucketIndex = (row * this.mapRowLength) + column;

                return rulesBucketIndex;
            };

            RulesMap.prototype.FillRule = function (rule, rulesBucketConstructionStateList) {
                var _this = this;
                var specificRule = rule.Descriptor.LeftTokenRange != Formatting.Shared.TokenRange.Any && rule.Descriptor.RightTokenRange != Formatting.Shared.TokenRange.Any;

                rule.Descriptor.LeftTokenRange.GetTokens().forEach(function (left) {
                    rule.Descriptor.RightTokenRange.GetTokens().forEach(function (right) {
                        var rulesBucketIndex = _this.GetRuleBucketIndex(left, right);

                        var rulesBucket = _this.map[rulesBucketIndex];
                        if (rulesBucket == undefined) {
                            rulesBucket = _this.map[rulesBucketIndex] = new RulesBucket();
                        }

                        rulesBucket.AddRule(rule, specificRule, rulesBucketConstructionStateList, rulesBucketIndex);
                    });
                });
            };

            RulesMap.prototype.GetRule = function (context) {
                var bucketIndex = this.GetRuleBucketIndex(context.currentTokenSpan.kind(), context.nextTokenSpan.kind());
                var bucket = this.map[bucketIndex];
                if (bucket != null) {
                    for (var i = 0, len = bucket.Rules().length; i < len; i++) {
                        var rule = bucket.Rules()[i];
                        if (rule.Operation.Context.InContext(context))
                            return rule;
                    }
                }
                return null;
            };
            return RulesMap;
        })();
        Formatting.RulesMap = RulesMap;

        var MaskBitSize = 5;
        var Mask = 0x1f;

        (function (RulesPosition) {
            RulesPosition[RulesPosition["IgnoreRulesSpecific"] = 0] = "IgnoreRulesSpecific";
            RulesPosition[RulesPosition["IgnoreRulesAny"] = MaskBitSize * 1] = "IgnoreRulesAny";
            RulesPosition[RulesPosition["ContextRulesSpecific"] = MaskBitSize * 2] = "ContextRulesSpecific";
            RulesPosition[RulesPosition["ContextRulesAny"] = MaskBitSize * 3] = "ContextRulesAny";
            RulesPosition[RulesPosition["NoContextRulesSpecific"] = MaskBitSize * 4] = "NoContextRulesSpecific";

            RulesPosition[RulesPosition["NoContextRulesAny"] = MaskBitSize * 5] = "NoContextRulesAny";
        })(Formatting.RulesPosition || (Formatting.RulesPosition = {}));
        var RulesPosition = Formatting.RulesPosition;

        var RulesBucketConstructionState = (function () {
            function RulesBucketConstructionState() {
                this.rulesInsertionIndexBitmap = 0;
            }
            RulesBucketConstructionState.prototype.GetInsertionIndex = function (maskPosition) {
                var index = 0;

                var pos = 0;
                var indexBitmap = this.rulesInsertionIndexBitmap;

                while (pos <= maskPosition) {
                    index += (indexBitmap & Mask);
                    indexBitmap >>= MaskBitSize;
                    pos += MaskBitSize;
                }

                return index;
            };

            RulesBucketConstructionState.prototype.IncreaseInsertionIndex = function (maskPosition) {
                var value = (this.rulesInsertionIndexBitmap >> maskPosition) & Mask;
                value++;
                TypeScript.Debug.assert((value & Mask) == value, "Adding more rules into the sub-bucket than allowed. Maximum allowed is 32 rules.");

                var temp = this.rulesInsertionIndexBitmap & ~(Mask << maskPosition);
                temp |= value << maskPosition;

                this.rulesInsertionIndexBitmap = temp;
            };
            return RulesBucketConstructionState;
        })();
        Formatting.RulesBucketConstructionState = RulesBucketConstructionState;

        var RulesBucket = (function () {
            function RulesBucket() {
                this.rules = [];
            }
            RulesBucket.prototype.Rules = function () {
                return this.rules;
            };

            RulesBucket.prototype.AddRule = function (rule, specificTokens, constructionState, rulesBucketIndex) {
                var position;

                if (rule.Operation.Action == Formatting.RuleAction.Ignore) {
                    position = specificTokens ? RulesPosition.IgnoreRulesSpecific : RulesPosition.IgnoreRulesAny;
                } else if (!rule.Operation.Context.IsAny()) {
                    position = specificTokens ? RulesPosition.ContextRulesSpecific : RulesPosition.ContextRulesAny;
                } else {
                    position = specificTokens ? RulesPosition.NoContextRulesSpecific : RulesPosition.NoContextRulesAny;
                }

                var state = constructionState[rulesBucketIndex];
                if (state === undefined) {
                    state = constructionState[rulesBucketIndex] = new RulesBucketConstructionState();
                }
                var index = state.GetInsertionIndex(position);
                this.rules.splice(index, 0, rule);
                state.IncreaseInsertionIndex(position);
            };
            return RulesBucket;
        })();
        Formatting.RulesBucket = RulesBucket;
    })(TypeScript.Formatting || (TypeScript.Formatting = {}));
    var Formatting = TypeScript.Formatting;
})(TypeScript || (TypeScript = {}));
